using System.Collections.Concurrent;
using CiviCore.Api.Models;

namespace CiviCore.Api.Services;

public class ImportJobTracker
{
    private readonly ConcurrentDictionary<Guid, ImportJobStatus> _jobs = new();

    public ImportJobStatus CreateJob()
    {
        var job = new ImportJobStatus();
        _jobs[job.JobId] = job;
        return job;
    }

    public ImportJobStatus? GetJob(Guid jobId)
    {
        _jobs.TryGetValue(jobId, out var job);
        return job;
    }
}
