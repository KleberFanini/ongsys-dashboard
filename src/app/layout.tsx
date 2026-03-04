// ongsys-dashboard/src/app/layout.tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AppSidebar } from "../components/AppSidebar"
import { SidebarProvider } from "../components/ui/sidebar"
import { TopBar } from "../components/ui/TopBar"
import { ThemeProvider } from "../components/ThemeProvider"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: "Ongsys Dashboard",
  description: "Dashboard para gestão financeira",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
        try {
          const theme = localStorage.getItem('theme')
          if (theme === 'dark') {
            document.documentElement.classList.add('dark')
          } else if (theme === 'light') {
            document.documentElement.classList.remove('dark')
          }
        } catch (e) {}
      `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <SidebarProvider>
            <div className="flex min-h-screen">
              <AppSidebar />
              <div className="flex-1 flex flex-col">
                <TopBar title="Dashboard" />
                <main className="flex-1 p-6 bg-background">
                  {children}
                </main>
              </div>
            </div>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}