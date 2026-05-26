import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bill, BillDocument } from 'src/bill/entities/bill.entity';
import { FinanceEntry, FinanceEntryDocument, FinanceEntryKind, FinanceEntryStatus } from 'src/finance-entry/entities/finance-entry.entity';
import { Property, PropertyDocument } from 'src/property/entities/property.entity';
import { Technician, TechnicianDocument } from 'src/technician/entities/technician.entity';
import { Tenant, TenantDocument } from 'src/tenant/entities/tenant.entity';
import { Ticket, TicketDocument, TicketPriority, TicketStatus } from 'src/ticket/entities/ticket.entity';
import { Unit, UnitDocument, UnitStatus } from 'src/unit/entities/unit.entity';
import { WorkOrder, WorkOrderDocument } from 'src/work-order/entities/work-order.entity';
import { Inspection, InspectionDocument } from 'src/inspection/entities/inspection.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Ticket.name) private readonly ticketModel: Model<TicketDocument>,
    @InjectModel(Unit.name) private readonly unitModel: Model<UnitDocument>,
    @InjectModel(Property.name) private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(Technician.name)
    private readonly technicianModel: Model<TechnicianDocument>,
    @InjectModel(Tenant.name) private readonly tenantModel: Model<TenantDocument>,
    @InjectModel(Bill.name) private readonly billModel: Model<BillDocument>,
    @InjectModel(FinanceEntry.name) private readonly financeEntryModel: Model<FinanceEntryDocument>,
    @InjectModel(WorkOrder.name) private readonly workOrderModel: Model<WorkOrderDocument>,
    @InjectModel(Inspection.name) private readonly inspectionModel: Model<InspectionDocument>,
  ) {}

  async getDashboard(organizationId: string, propertyId?: string) {
    const scoped = propertyId ? { organizationId, propertyId } : { organizationId };
    const [totalTickets, openTickets, emergencyTickets, totalProperties, totalUnits, occupiedUnits, finance] =
      await Promise.all([
        this.ticketModel.countDocuments(scoped),
        this.ticketModel.countDocuments({ ...scoped, status: { $ne: TicketStatus.COMPLETED } }),
        this.ticketModel.countDocuments({ ...scoped, priority: TicketPriority.EMERGENCY }),
        this.propertyModel.countDocuments({ organizationId }),
        this.unitModel.countDocuments(scoped),
        this.unitModel.countDocuments({ ...scoped, status: UnitStatus.OCCUPIED }),
        this.getFinanceSummary(organizationId, propertyId),
      ]);

    return {
      totalTickets,
      openTickets,
      emergencyTickets,
      totalProperties,
      totalUnits,
      occupiedUnits,
      occupancyRate: totalUnits ? Number(((occupiedUnits / totalUnits) * 100).toFixed(2)) : 0,
      finance,
    };
  }

  async getTicketStats(organizationId: string, propertyId?: string) {
    const scoped = propertyId ? { organizationId, propertyId } : { organizationId };
    const [byStatus, byPriority] = await Promise.all([
      this.ticketModel.aggregate([
        { $match: scoped },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.ticketModel.aggregate([
        { $match: scoped },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
    ]);

    return { byStatus, byPriority };
  }

  async getOccupancyStats(organizationId: string, propertyId?: string) {
    const scoped = propertyId ? { organizationId, propertyId } : { organizationId };
    const [vacant, occupied, maintenance, reserved] = await Promise.all([
      this.unitModel.countDocuments({ ...scoped, status: UnitStatus.VACANT }),
      this.unitModel.countDocuments({ ...scoped, status: UnitStatus.OCCUPIED }),
      this.unitModel.countDocuments({ ...scoped, status: UnitStatus.MAINTENANCE }),
      this.unitModel.countDocuments({ ...scoped, status: UnitStatus.RESERVED }),
    ]);

    return { vacant, occupied, maintenance, reserved };
  }

  async getTechnicianStats(organizationId: string) {
    const [totalTechnicians, activeTechnicians, totalTenants] = await Promise.all([
      this.technicianModel.countDocuments({ organizationId }),
      this.technicianModel.countDocuments({ organizationId, isActive: true }),
      this.tenantModel.countDocuments({ organizationId, isActive: true }),
    ]);

    return { totalTechnicians, activeTechnicians, totalTenants };
  }

  private async getFinanceSummary(organizationId: string, propertyId?: string) {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const sixMonthStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const billFilter: Record<string, any> = { organizationId };
    const financeFilter: Record<string, any> = {
      organizationId,
      status: { $ne: FinanceEntryStatus.CANCELED },
      occurredAt: { $gte: sixMonthStart },
    };

    if (propertyId) {
      billFilter.propertyId = propertyId;
      financeFilter.propertyId = propertyId;
    }

    const scoped = propertyId ? { organizationId, propertyId } : { organizationId };
    const [paidBills, dueBills, financeEntries, emergencyTickets, maintenanceUnits, workOrders, inspections] = await Promise.all([
      this.billModel.find({ ...billFilter, status: 'paid' }).lean(),
      this.billModel.find({ ...billFilter, status: { $in: ['unpaid', 'overdue', 'partial'] } }).lean(),
      this.financeEntryModel.find(financeFilter).lean(),
      this.ticketModel.countDocuments({ ...scoped, priority: TicketPriority.EMERGENCY, status: { $ne: TicketStatus.COMPLETED } }),
      this.unitModel.countDocuments({ ...scoped, status: UnitStatus.MAINTENANCE }),
      this.workOrderModel.find(scoped).lean(),
      this.inspectionModel.find(scoped).lean(),
    ]);

    const manualEarnings = financeEntries.filter((item) => item.kind === FinanceEntryKind.EARNING);
    const manualExpenses = financeEntries.filter((item) => item.kind === FinanceEntryKind.EXPENSE);
    const totalManualEarnings = manualEarnings.reduce((sum, item) => sum + (item.amount ?? 0), 0);
    const totalExpenses = manualExpenses.reduce((sum, item) => sum + (item.amount ?? 0), 0);
    const totalBillEarnings = paidBills.reduce((sum, item) => sum + (item.amount ?? 0), 0);
    const dueAmount = dueBills.reduce((sum, item) => sum + (item.amount ?? 0), 0);
    const workOrderEstimatedCost = workOrders.reduce((sum, item) => sum + (item.estimatedCost ?? 0), 0);
    const workOrderActualCost = workOrders.reduce((sum, item) => sum + (item.actualCost ?? 0), 0);
    const inspectionEstimatedCost = inspections.reduce((sum, item) => sum + (item.estimatedCost ?? 0), 0);
    const inspectionActualCost = inspections.reduce((sum, item) => sum + (item.actualCost ?? 0), 0);

    const inRangeAmount = (amounts: number[]) => amounts.reduce((sum, amount) => sum + amount, 0);
    const currentMonthBillEarnings = inRangeAmount(
      paidBills
        .filter((item) => item.paidAt && new Date(item.paidAt) >= currentMonthStart && new Date(item.paidAt) < nextMonthStart)
        .map((item) => item.amount ?? 0),
    );
    const previousMonthBillEarnings = inRangeAmount(
      paidBills
        .filter((item) => item.paidAt && new Date(item.paidAt) >= previousMonthStart && new Date(item.paidAt) < currentMonthStart)
        .map((item) => item.amount ?? 0),
    );
    const currentMonthManualEarnings = inRangeAmount(
      manualEarnings
        .filter((item) => item.occurredAt >= currentMonthStart && item.occurredAt < nextMonthStart)
        .map((item) => item.amount ?? 0),
    );
    const previousMonthManualEarnings = inRangeAmount(
      manualEarnings
        .filter((item) => item.occurredAt >= previousMonthStart && item.occurredAt < currentMonthStart)
        .map((item) => item.amount ?? 0),
    );
    const currentMonthExpenses = inRangeAmount(
      manualExpenses
        .filter((item) => item.occurredAt >= currentMonthStart && item.occurredAt < nextMonthStart)
        .map((item) => item.amount ?? 0),
    );
    const previousMonthExpenses = inRangeAmount(
      manualExpenses
        .filter((item) => item.occurredAt >= previousMonthStart && item.occurredAt < currentMonthStart)
        .map((item) => item.amount ?? 0),
    );

    const currentMonthEarnings = currentMonthBillEarnings + currentMonthManualEarnings;
    const previousMonthEarnings = previousMonthBillEarnings + previousMonthManualEarnings;

    const monthlySeries = Array.from({ length: 6 }).map((_, index) => {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - (4 - index), 1);
      const month = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;

      return {
        month,
        earnings:
          inRangeAmount(
            paidBills
              .filter((item) => item.paidAt && new Date(item.paidAt) >= monthStart && new Date(item.paidAt) < monthEnd)
              .map((item) => item.amount ?? 0),
          ) +
          inRangeAmount(
            manualEarnings
              .filter((item) => item.occurredAt >= monthStart && item.occurredAt < monthEnd)
              .map((item) => item.amount ?? 0),
          ),
        expenses: inRangeAmount(
          manualExpenses
            .filter((item) => item.occurredAt >= monthStart && item.occurredAt < monthEnd)
            .map((item) => item.amount ?? 0),
        ),
        due: inRangeAmount(
          dueBills
            .filter((item) => item.dueDate && new Date(item.dueDate) >= monthStart && new Date(item.dueDate) < monthEnd)
            .map((item) => item.amount ?? 0),
        ),
      };
    });

    const topExpenseCategories = Object.entries(
      manualExpenses.reduce<Record<string, number>>((acc, item) => {
        acc[item.category] = (acc[item.category] ?? 0) + (item.amount ?? 0);
        return acc;
      }, {}),
    )
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
      .map(([label, total]) => ({ label, total }));

    const topEarningCategories = Object.entries(
      manualEarnings.reduce<Record<string, number>>((acc, item) => {
        acc[item.category] = (acc[item.category] ?? 0) + (item.amount ?? 0);
        return acc;
      }, {}),
    )
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
      .map(([label, total]) => ({ label, total }));

    const overdueBills = dueBills.filter((item) => item.dueDate && new Date(item.dueDate) < now);

    return {
      totalEarnings: totalBillEarnings + totalManualEarnings,
      totalExpenses,
      netIncome: totalBillEarnings + totalManualEarnings - totalExpenses,
      dueAmount,
      unpaidBills: dueBills.length,
      overdueBills: overdueBills.length,
      currentMonthEarnings,
      currentMonthExpenses,
      currentMonthNet: currentMonthEarnings - currentMonthExpenses,
      previousMonthEarnings,
      previousMonthExpenses,
      earningsGrowthPct: this.growth(currentMonthEarnings, previousMonthEarnings),
      expenseGrowthPct: this.growth(currentMonthExpenses, previousMonthExpenses),
      topExpenseCategories,
      topEarningCategories,
      monthlySeries,
      issueSummary: [
        { label: 'Overdue bills', count: overdueBills.length, amount: overdueBills.reduce((sum, item) => sum + (item.amount ?? 0), 0) },
        { label: 'Emergency tickets', count: emergencyTickets, amount: 0 },
        { label: 'Maintenance units', count: maintenanceUnits, amount: 0 },
        { label: 'Work order cost', count: workOrders.length, amount: workOrderActualCost || workOrderEstimatedCost },
        { label: 'Inspection cost', count: inspections.length, amount: inspectionActualCost || inspectionEstimatedCost },
      ],
      opsCosts: {
        workOrders: {
          count: workOrders.length,
          estimated: workOrderEstimatedCost,
          actual: workOrderActualCost,
        },
        inspections: {
          count: inspections.length,
          estimated: inspectionEstimatedCost,
          actual: inspectionActualCost,
        },
      },
    };
  }

  private growth(current: number, previous: number) {
    if (!previous) return current ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(2));
  }
}
