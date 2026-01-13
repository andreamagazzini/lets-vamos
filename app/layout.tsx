import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "Let's Vamos - Stay accountable with your training crew",
  description: 'A shared group dashboard for small training groups to track workouts and stay accountable',
  icons: {
    icon: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
