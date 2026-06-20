// import {
//   AppWindow,
//   Bell,
//   CalendarDays,
//   Folder,
//   Music,
//   Search,
//   Settings,
//   StickyNote,
//   Wifi,
// } from "lucide-react";

// const folderIcons = [
//   {
//     label: "Career",
//     className: "apple-folder-career",
//   },
//   {
//     label: "Study",
//     className: "apple-folder-study",
//   },
//   {
//     label: "Memo",
//     className: "apple-folder-memo",
//   },
//   {
//     label: "Health",
//     className: "apple-folder-health",
//   },
// ];

// const dockItems = [
//   { label: "Calendar", icon: CalendarDays },
//   { label: "Memo", icon: StickyNote },
//   { label: "Music", icon: Music },
//   { label: "Settings", icon: Settings },
// ];

// export const AppleDesktopDecor = () => {
//   return (
//     <div className="apple-desktop-decor" aria-hidden="true">
//       <div className="apple-menu-bar">
//         <div className="apple-menu-left">
//           <span className="apple-logo"/>
//           <span>Finder</span>
//           <span>File</span>
//           <span>Edit</span>
//           {/* <span>View</span> */}
//           <span>Go</span>
//           <span>Window</span>
//           <span>Help</span>
//         </div>

//         <div className="apple-menu-right">
//           <Wifi className="w-3.5 h-3.5" />
//           <Search className="w-3.5 h-3.5" />
//           <Bell className="w-3.5 h-3.5" />
//           <span>Tue 9:41 AM</span>
//         </div>
//       </div>

//       <div className="apple-floating-notification">
//         <div className="apple-notification-icon">
//           <Bell className="w-4 h-4" />
//         </div>
//         <div>
//           <strong>Glassday</strong>
//           <span>Today’s focus is ready.</span>
//         </div>
//       </div>

//       {folderIcons.map((item) => (
//         <div
//           key={item.label}
//           className={`apple-desktop-folder ${item.className}`}
//         >
//           <div className="apple-folder-shape">
//             <Folder className="w-8 h-8" />
//           </div>
//           <span>{item.label}</span>
//         </div>
//       ))}

//       <div className="apple-dock">
//         {dockItems.map((item) => {
//           const Icon = item.icon;

//           return (
//             <div key={item.label} className="apple-dock-item">
//               <Icon className="w-5 h-5" />
//             </div>
//           );
//         })}

//         <div className="apple-dock-separator" />

//         <div className="apple-dock-item">
//           <AppWindow className="w-5 h-5" />
//         </div>
//       </div>
//     </div>
//   );
// };