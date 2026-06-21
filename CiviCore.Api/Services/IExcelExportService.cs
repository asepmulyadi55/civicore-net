using System.Collections.Generic;
using CiviCore.Domain.Entities;

namespace CiviCore.Api.Services;

public interface IExcelExportService
{
    byte[] ExportPayments(IEnumerable<PaymentRecord> payments);
    byte[] ExportFinanceTransactions(IEnumerable<FinanceTransaction> transactions);
}
