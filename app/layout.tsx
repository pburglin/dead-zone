import type { Metadata } from "next";
import "./globals.css";
import "./audio.css";
import "./visual-fixes.css";
import "./turn-map.css";
export const metadata:Metadata={title:"Dead Zone: Last Stand",description:"A cooperative turn-based zombie survival board game.",icons:{icon:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
