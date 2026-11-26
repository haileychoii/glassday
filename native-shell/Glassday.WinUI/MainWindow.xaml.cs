using System;
using Microsoft.UI.Xaml;
using Windows.Graphics;

// To learn more about WinUI, the WinUI project structure,
// and more about our project templates, see: http://aka.ms/winui-project-info.

namespace Glassday_WinUI;

/// <summary>
/// The application window. This hosts a Frame that displays pages. Add your
/// UI and logic to MainPage.xaml / MainPage.xaml.cs instead of here so you
/// can use Page features such as navigation events and the Loaded lifecycle.
/// </summary>
public sealed partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();

        // KO: 이 클래스는 OS 창과 backdrop만 담당한다. 화면 자체는 MainPage의 WebView2가 담당한다.
        // EN: This class owns the native window/backdrop; MainPage owns the dashboard content.

        ExtendsContentIntoTitleBar = true;
        SetTitleBar(AppTitleBar);

        AppWindow.SetIcon("Assets/AppIcon.ico");

        /*
         * KO: 웹 Laptop 기준 프레임 1080×720px의 90%인 972×648px로
         *     WinUI 첫 실행 창을 연다. MainPage는 이 창 안에서 같은 laptop
         *     dashboard를 더 작은 창 크기에 맞춰 렌더링한다. 여기서는 초기
         *     크기만 지정하며, 사용자가 이후 창을 리사이즈하는 동작은 막지 않는다.
         * EN: Start the native WinUI window at 90% of the Laptop reference
         *     frame (1080×720 px), resulting in 972×648 px. MainPage renders
         *     the matching dashboard within that smaller viewport. This only
         *     sets the initial size; the window remains user-resizable.
         *
         * 수정할 곳: laptopReferenceWidthPx/HeightPx는 원본 디자인 프레임,
         * initialWindowScale은 창 축소율이다. WinUI 시작 크기는 두 기준값에
         * 축소율을 곱해 계산한다. 웹 프레임 기준은
         * src/styles/layout-modes.css의 --gd-laptop-frame-width / height다.
         */
        const int laptopReferenceWidthPx = 1080;
        const int laptopReferenceHeightPx = 720;
        const double initialWindowScale = 0.9;
        AppWindow.Resize(new SizeInt32(
            (int)Math.Round(laptopReferenceWidthPx * initialWindowScale),
            (int)Math.Round(laptopReferenceHeightPx * initialWindowScale)
        ));

        // Navigate the root frame to the main page on startup.
        RootFrame.Navigate(typeof(MainPage));
    }
}
