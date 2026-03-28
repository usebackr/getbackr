import { registerCampaignAutoCloseWorker } from './campaignAutoClose';
import { registerBoostExpiryWorker } from './boostExpiry';
import { registerSubscriptionExpiryWorker } from './subscriptionExpiry';
import { registerEmailWorkers } from './emailWorkers';

export function registerAllWorkers(): void {
  registerCampaignAutoCloseWorker();
  registerBoostExpiryWorker();
  registerSubscriptionExpiryWorker();
  registerEmailWorkers();
}

export {
  registerCampaignAutoCloseWorker,
  registerBoostExpiryWorker,
  registerSubscriptionExpiryWorker,
  registerEmailWorkers,
};
