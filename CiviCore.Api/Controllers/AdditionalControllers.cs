using Microsoft.AspNetCore.Mvc;

namespace CiviCore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HomepageController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { hero = "Welcome", events = new string[] {} });
    }
}


[ApiController]
[Route("api/[controller]")]
public class OrganizationController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() { return Ok(new string[] {}); }
}

[ApiController]
[Route("api/[controller]")]
public class PropertyListingController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() { return Ok(new string[] {}); }
}

[ApiController]
[Route("api/[controller]")]
public class PosyanduController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() { return Ok(new string[] {}); }
}

[ApiController]
[Route("api/[controller]")]
public class SettingController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() { return Ok(new string[] {}); }
}

[ApiController]
[Route("api/[controller]")]
public class OverviewController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() { return Ok(new { message = "Overview dashboard" }); }
}
