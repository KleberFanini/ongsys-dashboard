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
          console.log('Script anti-flash - tema:', theme)
          if (theme === 'dark') {
            document.documentElement.classList.add('dark')
          } else if (theme === 'light') {
            document.documentElement.classList.remove('dark')
          } else {
            // SE NÃO TIVER TEMA SALVO, USA LIGHT (NÃO DARK)
            document.documentElement.classList.remove('dark')
            localStorage.setItem('theme', 'light')
          }
        } catch (e) {}
      `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <SidebarProvider>
            <div className="flex h-screen overflow-hidden">
              <div className="h-full overflow-y-auto">
                <AppSidebar />
              </div>
              <div className="flex-1 flex flex-col overflow-hidden">
                <TopBar title="Dashboard" />
                <main className="flex-1 overflow-y-auto p-6 bg-background">
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