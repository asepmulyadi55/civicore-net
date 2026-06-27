using Microsoft.AspNetCore.Mvc;

namespace CiviCore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrganizationController : ControllerBase
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
public class OverviewController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() { return Ok(new { message = "Overview dashboard" }); }
}
