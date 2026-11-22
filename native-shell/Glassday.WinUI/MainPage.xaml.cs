using System;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Windows.UI;

// To learn more about WinUI, the WinUI project structure,
// and more about our project templates, see: http://aka.ms/winui-project-info.

namespace Glassday_WinUI;

/// <summary>
/// The main content page displayed inside the application window.
/// Add your UI logic, event handlers, and data binding here.
/// </summary>
public sealed partial class MainPage : Page
{
    public MainPage()
    {
        InitializeComponent();

        Loaded += OnLoaded;
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        // Transparent WebView2 lets the native Windows Acrylic backdrop remain visible.
        await DashboardWebView.EnsureCoreWebView2Async();
        DashboardWebView.DefaultBackgroundColor = Color.FromArgb(0, 0, 0, 0);

        // Development uses Vite. GLASSDAY_DEV_URL supports a different local port.
        var devUrl = Environment.GetEnvironmentVariable("GLASSDAY_DEV_URL");
        var baseUrl = string.IsNullOrWhiteSpace(devUrl)
            ? "http://localhost:5173"
            : devUrl;

        // KO: WinUI는 React 앱 안에서 네이티브 데스크톱 셸로 인식되어야
        //     Tauri와 같은 Laptop layout과 창 실루엣을 사용한다.
        // EN: Mark the WebView as the native desktop shell so React uses the
        //     same Laptop layout and window silhouette as the Tauri build.
        var separator = baseUrl.Contains("?") ? "&" : "?";
        DashboardWebView.Source = new Uri(
            $"{baseUrl}{separator}shell=winui&layout=laptop");
    }
}
