$file = 'c:\xampp\htdocs\civicore-net\CiviCore.Frontend\src\pages\admin\Homepage.tsx'
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# Find the last occurrence of the MAIN COMPONENT comment section
$marker = "/* " + [char]0x2550 + [char]0x2550 + [char]0x2550
$markerIdx = $content.LastIndexOf($marker)
if ($markerIdx -lt 0) {
    Write-Host "Marker not found, trying alternate..."
    $markerIdx = $content.LastIndexOf("/* `u{2550}")
}
if ($markerIdx -lt 0) {
    Write-Host "ERROR: Could not find main component marker"
    exit 1
}

$beforeMarker = $content.Substring(0, $markerIdx)

$newMain = @"
/* Main Component */
export default function AdminHomepage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { tab } = useParams();
  const activeTab = tab || 'hero';

  const token = localStorage.getItem('admin_token');
  if (token) axios.defaults.headers.common['Authorization'] = "Bearer " + token;

  const renderTab = () => {
    switch (activeTab) {
      case 'hero': return React.createElement(HeroTab);
      case 'events': return React.createElement(EventsTab);
      case 'gallery': return React.createElement(GalleryTab);
      case 'bulletin': return React.createElement(BulletinTab);
      case 'property': return React.createElement(PropertyTab);
      case 'navigation': return React.createElement(NavigationTab);
      case 'footer': return React.createElement(FooterTab);
      case 'metadata': return React.createElement(MetadataTab);
      default: return null;
    }
  };

  const tabLabel = TABS.find(function(tb) { return tb.key === activeTab; });
  const tabTitle = t("homepage.tab_" + activeTab, { defaultValue: tabLabel ? tabLabel.label : 'Homepage CMS' });

  return (
    <AdminLayout title={tabTitle}>
      <div className="max-w-7xl mx-auto pb-12">
        <PageHeader title={tabTitle} subtitle={t('homepage.subtitle', { defaultValue: "Manage homepage content" })} />

        {!can('homepage.edit') && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3">
            <span className="material-icons text-amber-500">lock</span>
            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">You have view-only access to this section.</p>
          </div>
        )}

        {renderTab()}
      </div>
    </AdminLayout>
  );
}
"@

$finalContent = $beforeMarker + $newMain
[System.IO.File]::WriteAllText($file, $finalContent, [System.Text.Encoding]::UTF8)
Write-Host "Done! Lines: $((Get-Content $file).Count)"
