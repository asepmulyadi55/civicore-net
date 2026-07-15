namespace CiviCore.Api.Authorization;

/// <summary>
/// Requires an exact permission key, e.g. "payments.approve". Put on an action when the
/// HTTP verb alone doesn't imply the right key (a POST that approves, not creates).
/// Overrides <see cref="RequirePermissionModuleAttribute"/> on the controller.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
public sealed class RequirePermissionAttribute : Attribute
{
    public string Permission { get; }
    public RequirePermissionAttribute(string permission) => Permission = permission;
}

/// <summary>
/// Declares the module a controller belongs to, e.g. "householders". The action's key is
/// derived from the HTTP verb: GET→view, POST→create, PUT/PATCH→edit, DELETE→delete.
/// Keeps 160+ endpoints declarative without annotating each one by hand.
/// </summary>
[AttributeUsage(AttributeTargets.Class, AllowMultiple = false)]
public sealed class RequirePermissionModuleAttribute : Attribute
{
    public string Module { get; }
    public RequirePermissionModuleAttribute(string module) => Module = module;
}

/// <summary>
/// Any authenticated user may call this, regardless of role — e.g. reading your own
/// profile or signing out. Must be explicit: the filter denies anything undeclared,
/// so this states the intent rather than leaving a silent gap.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
public sealed class NoPermissionRequiredAttribute : Attribute
{
}
