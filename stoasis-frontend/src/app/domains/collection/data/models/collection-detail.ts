import { CollectionSummary } from './collection-summary';
import { Role } from '../../../../shared/models/role';

export interface CollectionDetail extends CollectionSummary {
  ownerId: string;
  inviteToken: string | null;
  currentUserRole: Role | null;
}
