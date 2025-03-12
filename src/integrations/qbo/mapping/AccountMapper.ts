
import { QBOAccount, SelectOption } from "./types";

export class AccountMapper {
  /**
   * Map QBO accounts to a select-friendly format
   */
  mapAccountsToSelectOptions(accounts: QBOAccount[]): SelectOption[] {
    return accounts.map(account => ({
      label: account.AcctNum 
        ? `${account.Name} (${account.AcctNum})` 
        : account.Name,
      value: account.Id,
      type: account.AccountType,
      subType: account.AccountSubType
    }));
  }
}
