using System.Reflection;
using CiviCore.Api.Authorization;
using CiviCore.Api.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;

namespace CiviCore.Tests;

/// <summary>
/// Guards the permission map itself. Enforcement is fail-closed, so the real risk is no
/// longer an open endpoint — it is a *mis-mapped* one, which silently 403s a legitimate
/// user. These tests reflect over every controller action and pin what it demands.
/// </summary>
public class PermissionMapTests
{
    private record ActionInfo(string Controller, string Action, string Verb, string? Required, bool Public, bool OptOut);

    /// <summary>Mirrors PermissionAuthorizationFilter.ResolveRequiredPermission.</summary>
    private static string? VerbToAction(string verb) => verb switch
    {
        "GET" or "HEAD" => "view",
        "POST" => "create",
        "PUT" or "PATCH" => "edit",
        "DELETE" => "delete",
        _ => null
    };

    private static IEnumerable<ActionInfo> AllActions()
    {
        var controllers = typeof(AuditController).Assembly.GetTypes()
            .Where(t => typeof(ControllerBase).IsAssignableFrom(t) && !t.IsAbstract);

        foreach (var controller in controllers)
        {
            var classAnon = controller.GetCustomAttribute<AllowAnonymousAttribute>() != null;
            var classOptOut = controller.GetCustomAttribute<NoPermissionRequiredAttribute>() != null;
            var classExplicit = controller.GetCustomAttribute<RequirePermissionAttribute>()?.Permission;
            var classModule = controller.GetCustomAttribute<RequirePermissionModuleAttribute>()?.Module;

            foreach (var method in controller.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly))
            {
                var verbs = method.GetCustomAttributes<HttpMethodAttribute>().SelectMany(a => a.HttpMethods).Distinct().ToList();
                if (verbs.Count == 0) continue;

                var isPublic = classAnon || method.GetCustomAttribute<AllowAnonymousAttribute>() != null;
                var optOut = classOptOut || method.GetCustomAttribute<NoPermissionRequiredAttribute>() != null;
                var explicitKey = method.GetCustomAttribute<RequirePermissionAttribute>()?.Permission ?? classExplicit;

                foreach (var verb in verbs)
                {
                    string? required = null;
                    if (!isPublic && !optOut)
                    {
                        if (explicitKey != null) required = explicitKey;
                        else if (classModule != null && VerbToAction(verb) is string a) required = $"{classModule}.{a}";
                    }

                    yield return new ActionInfo(controller.Name, method.Name, verb, required, isPublic, optOut);
                }
            }
        }
    }

    /// <summary>
    /// The grantable vocabulary, mirroring EditRole.tsx. If the API ever demands a key that
    /// isn't here, no role could hold it and the endpoint would 403 forever.
    /// </summary>
    private static readonly Dictionary<string, string[]> Vocabulary = new()
    {
        ["dashboard"] = new[] { "view" },
        ["householders"] = new[] { "view", "create", "edit", "delete" },
        ["blocks"] = new[] { "view", "create", "edit", "delete" },
        ["organization"] = new[] { "view", "create", "edit", "delete" },
        ["meetings"] = new[] { "view", "create", "edit", "delete" },
        ["posyandu"] = new[] { "view", "create", "edit", "delete" },
        ["finance"] = new[] { "view", "create", "edit", "delete", "approve" },
        ["payments"] = new[] { "view", "create", "edit", "delete", "approve" },
        ["reports"] = new[] { "view" },
        ["users"] = new[] { "view", "create", "edit", "delete", "approve" },
        ["roles"] = new[] { "view", "create", "edit", "delete" },
        ["media"] = new[] { "view", "create", "delete" },
        ["audit"] = new[] { "view" },
        ["homepage_hero"] = new[] { "view", "edit" },
        ["homepage_events"] = new[] { "view", "create", "edit", "delete" },
        ["homepage_gallery"] = new[] { "view", "create", "edit", "delete" },
        ["homepage_bulletin"] = new[] { "view", "create", "edit", "delete" },
        ["homepage_property"] = new[] { "view", "create", "edit", "delete" },
        ["homepage_navigation"] = new[] { "view", "create", "edit", "delete" },
        ["homepage_footer"] = new[] { "view", "edit" },
        ["homepage_emergency"] = new[] { "view", "edit" },
        ["homepage_metadata"] = new[] { "view", "edit" },
        ["overview"] = new[] { "view" },
        ["my_household"] = new[] { "view", "edit" },
        ["settings_profile"] = new[] { "view", "edit" },
        ["settings_password"] = new[] { "view", "edit" },
        ["settings_security"] = new[] { "view", "edit" },
        ["settings_memo"] = new[] { "view", "edit" },
        ["settings_posyandu"] = new[] { "view", "edit" },
    };

    // Enforcement is fail-closed, so an undeclared endpoint is a broken feature. This
    // fails the moment someone adds an action without deciding who may call it.
    [Fact]
    public void Every_Endpoint_Declares_Its_Access()
    {
        var undeclared = AllActions()
            .Where(a => !a.Public && !a.OptOut && a.Required == null)
            .Select(a => $"{a.Controller}.{a.Action} [{a.Verb}]")
            .ToList();

        Assert.True(undeclared.Count == 0,
            "These endpoints declare no permission and will be denied at runtime. Add " +
            "[RequirePermissionModule], [RequirePermission] or [NoPermissionRequired]:\n  " +
            string.Join("\n  ", undeclared));
    }

    // A key outside the vocabulary can never be granted, so the endpoint would 403 for
    // everyone except wildcard admins — the exact bug media.create used to have.
    [Fact]
    public void Every_Required_Key_Is_Grantable_In_The_Role_Editor()
    {
        var ungrantable = AllActions()
            .Where(a => a.Required != null)
            .Select(a => a.Required!)
            .Distinct()
            .Where(key =>
            {
                var parts = key.Split('.');
                return parts.Length != 2
                    || !Vocabulary.TryGetValue(parts[0], out var actions)
                    || !actions.Contains(parts[1]);
            })
            .OrderBy(k => k)
            .ToList();

        Assert.True(ungrantable.Count == 0,
            "The API demands keys no role can hold (not present in EditRole.tsx):\n  " +
            string.Join("\n  ", ungrantable));
    }

    private static string? RequiredFor(string controller, string action) =>
        AllActions().FirstOrDefault(a => a.Controller == controller && a.Action == action)?.Required;

    // The mappings where the HTTP verb lies. If someone drops the override, the convention
    // silently downgrades these to "create"/"delete" and the wrong people get access.
    [Theory]
    // Approvals are not creates
    [InlineData(nameof(PaymentController), "Approve", "payments.approve")]
    [InlineData(nameof(PaymentController), "Reject", "payments.approve")]
    [InlineData(nameof(FinanceController), "ApproveReport", "finance.approve")]
    [InlineData(nameof(FinanceController), "RejectReport", "finance.approve")]
    [InlineData(nameof(UserController), "Approve", "users.approve")]
    // POSTs that mutate an existing record are edits
    [InlineData(nameof(UserController), "Deactivate", "users.edit")]
    [InlineData(nameof(UserController), "Reactivate", "users.edit")]
    // my_household grants only view/edit — create/delete keys would not exist
    [InlineData(nameof(ResidentPortalController), "AddResident", "my_household.edit")]
    [InlineData(nameof(ResidentPortalController), "DeleteResident", "my_household.edit")]
    [InlineData(nameof(ResidentPortalController), "GetOverview", "overview.view")]
    // Destructive bulk operations must demand delete
    [InlineData(nameof(HouseholderController), "BulkDelete", "householders.delete")]
    [InlineData(nameof(BlockController), "BulkDelete", "blocks.delete")]
    [InlineData(nameof(UnitController), "BulkDelete", "blocks.delete")]
    // Homepage mutations map to their own module, not a shared one
    [InlineData(nameof(HomepageController), "UpdateEmergencyContacts", "homepage_emergency.edit")]
    [InlineData(nameof(HomepageController), "UpdateHero", "homepage_hero.edit")]
    [InlineData(nameof(HomepageController), "DestroyEvent", "homepage_events.delete")]
    // Audit rows carry every user's email and IP
    [InlineData(nameof(AuditController), "GetAll", "audit.view")]
    public void High_Risk_Endpoints_Demand_The_Expected_Permission(string controller, string action, string expected) =>
        Assert.Equal(expected, RequiredFor(controller, action));

    // The public site reads these unauthenticated; gating them would break the homepage.
    [Theory]
    [InlineData(nameof(HomepageController), "GetHero")]
    [InlineData(nameof(HomepageController), "GetEvents")]
    [InlineData(nameof(HomepageController), "GetEmergencyContacts")]
    [InlineData(nameof(HomepageController), "SubmitReport")]
    public void Public_Homepage_Reads_Stay_Public(string controller, string action)
    {
        var info = AllActions().FirstOrDefault(a => a.Controller == controller && a.Action == action);
        Assert.NotNull(info);
        Assert.True(info!.Public, $"{controller}.{action} must stay [AllowAnonymous] — the public site calls it.");
    }

    // Signing in and out cannot itself require a permission, or nobody could ever log in.
    [Theory]
    [InlineData("Login")]
    [InlineData("Logout")]
    [InlineData("GetPermissions")]
    public void Auth_Endpoints_Never_Require_A_Permission(string action)
    {
        var info = AllActions().FirstOrDefault(a => a.Controller == nameof(AuthController) && a.Action == action);
        Assert.NotNull(info);
        Assert.Null(info!.Required);
    }
}
