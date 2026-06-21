using System.Collections.Generic;
using System.IO;
using ClosedXML.Excel;
using CiviCore.Domain.Entities;

namespace CiviCore.Api.Services;

public class ExcelExportService : IExcelExportService
{
    public byte[] ExportPayments(IEnumerable<PaymentRecord> payments)
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Payments");

        worksheet.Cell(1, 1).Value = "ID";
        worksheet.Cell(1, 2).Value = "Householder";
        worksheet.Cell(1, 3).Value = "Block";
        worksheet.Cell(1, 4).Value = "Unit";
        worksheet.Cell(1, 5).Value = "Amount";
        worksheet.Cell(1, 6).Value = "Status";
        worksheet.Cell(1, 7).Value = "Date";

        var row = 2;
        foreach (var p in payments)
        {
            worksheet.Cell(row, 1).Value = p.Id.ToString();
            worksheet.Cell(row, 2).Value = p.HouseholderName ?? p.Householder?.Fullname ?? "";
            worksheet.Cell(row, 3).Value = p.Block?.Name ?? "";
            worksheet.Cell(row, 4).Value = p.UnitNumber ?? "";
            worksheet.Cell(row, 5).Value = p.Amount;
            worksheet.Cell(row, 6).Value = p.Status.ToString();
            worksheet.Cell(row, 7).Value = p.CreatedAt.ToString("yyyy-MM-dd");
            row++;
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public byte[] ExportFinanceTransactions(IEnumerable<FinanceTransaction> transactions)
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Finance Transactions");

        worksheet.Cell(1, 1).Value = "ID";
        worksheet.Cell(1, 2).Value = "Description";
        worksheet.Cell(1, 3).Value = "Amount";
        worksheet.Cell(1, 4).Value = "Type";
        worksheet.Cell(1, 5).Value = "Date";

        var row = 2;
        foreach (var t in transactions)
        {
            worksheet.Cell(row, 1).Value = t.Id.ToString();
            worksheet.Cell(row, 2).Value = t.Description ?? "";
            worksheet.Cell(row, 3).Value = t.Amount;
            worksheet.Cell(row, 4).Value = t.Type.ToString();
            worksheet.Cell(row, 5).Value = t.Date.ToString("yyyy-MM-dd");
            row++;
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }
}
