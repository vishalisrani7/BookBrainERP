import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLogDocument extends Document {
  user: string;
  action: string;
  entity?: string;
  module?: string;
  entityId?: string;
  referenceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    user: { type: String, required: true },
    action: { type: String, required: true },
    entity: {
      type: String,
      default: function (this: any) {
        return this.module || 'SYSTEM';
      },
    },
    module: { type: String },
    entityId: {
      type: String,
      default: function (this: any) {
        return this.referenceId || undefined;
      },
    },
    referenceId: { type: String },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

export const AuditLogModel = mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);
