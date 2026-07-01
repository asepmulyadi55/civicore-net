using System;

namespace CiviCore.Domain.Entities
{
    public class NavigationLink
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Title { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public bool ShowInNavigation { get; set; } = true;
        public bool ShowInFooter { get; set; } = true;
        public int Order { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
