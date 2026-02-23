param(
    [Parameter(Mandatory=$true)]
    [string]$Title,
    
    [Parameter(Mandatory=$true)]
    [string]$Message,

    [Parameter(Mandatory=$false)]
    [string]$Url,
    
    [Parameter(Mandatory=$false)]
    [string]$AppName = "Vibe Kanban"
)

[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
$Template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
$RawXml = [xml] $Template.GetXml()
($RawXml.toast.visual.binding.text|where {$_.id -eq "1"}).AppendChild($RawXml.CreateTextNode($Title)) | Out-Null
($RawXml.toast.visual.binding.text|where {$_.id -eq "2"}).AppendChild($RawXml.CreateTextNode($Message)) | Out-Null
if ($Url) {
    $RawXml.toast.SetAttribute("activationType", "protocol")
    $RawXml.toast.SetAttribute("launch", $Url)
    $Actions = $RawXml.CreateElement("actions")
    $Action = $RawXml.CreateElement("action")
    $Action.SetAttribute("content", "Open")
    $Action.SetAttribute("activationType", "protocol")
    $Action.SetAttribute("arguments", $Url)
    $Actions.AppendChild($Action) | Out-Null
    $RawXml.toast.AppendChild($Actions) | Out-Null
}
$SerializedXml = New-Object Windows.Data.Xml.Dom.XmlDocument
$SerializedXml.LoadXml($RawXml.OuterXml)
$Toast = [Windows.UI.Notifications.ToastNotification]::new($SerializedXml)
$Toast.Tag = $AppName
$Toast.Group = $AppName
$Notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($AppName)
$Notifier.Show($Toast)
