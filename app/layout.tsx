import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./audio.css";
import "./visual-fixes.css";
import "./turn-map.css";
export const metadata:Metadata={title:"Dead Zone: Last Stand",description:"A cooperative turn-based zombie survival board game.",icons:{icon:"/favicon.svg"}};
export const viewport:Viewport={width:"device-width",initialScale:1,maximumScale:1,userScalable:false,viewportFit:"cover"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
