import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property, PropertyDocument } from 'src/property/entities/property.entity';
import { Technician, TechnicianDocument } from 'src/technician/entities/technician.entity';
import { Tenant, TenantDocument } from 'src/tenant/entities/tenant.entity';
import { Ticket, TicketDocument, TicketPriority, TicketStatus } from 'src/ticket/entities/ticket.entity';
import { Unit, UnitDocument, UnitStatus } from 'src/unit/entities/unit.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Ticket.name) private readonly ticketModel: Model<TicketDocument>,
    @InjectModel(Unit.name) private readonly unitModel: Model<UnitDocument>,
    @InjectModel(Property.name) private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(Technician.name)
    private readonly technicianModel: Model<TechnicianDocument>,
    @InjectModel(Tenant.name) private readonly tenantModel: Model<TenantDocument>,
  ) {}

  async getDashboard(organizationId: string, propertyId?: string) {
    const scoped = propertyId ? { organizationId, propertyId } : { organizationId };
    const [totalTickets, openTickets, emergencyTickets, totalProperties, totalUnits, occupiedUnits] =
      await Promise.all([
        this.ticketModel.countDocuments(scoped),
        this.ticketModel.countDocuments({ ...scoped, status: { $ne: TicketStatus.COMPLETED } }),
        this.ticketModel.countDocuments({ ...scoped, priority: TicketPriority.EMERGENCY }),
        this.propertyModel.countDocuments({ organizationId }),
        this.unitModel.countDocuments(scoped),
        this.unitModel.countDocuments({ ...scoped, status: UnitStatus.OCCUPIED }),
      ]);

    return {
      totalTickets,
      openTickets,
      emergencyTickets,
      totalProperties,
      totalUnits,
      occupiedUnits,
      occupancyRate: totalUnits ? Number(((occupiedUnits / totalUnits) * 100).toFixed(2)) : 0,
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
}
