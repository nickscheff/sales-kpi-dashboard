import type { DashboardData } from '../types'

function currentMonthYear(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function currentQuarterLabel(): string {
  const now = new Date()
  const quarter = Math.ceil((now.getMonth() + 1) / 3)
  return `${now.getFullYear()}-Q${quarter}`
}

export function createDefaultData(): DashboardData {
  return {
    currentMonth: {
      monthYear: currentMonthYear(),
      settings: {
        monthlyTarget: 50000,
        baseSalary: 3000,
        commissionRate: 8,
        ticketSize: 2500,
        closingRate: 30,
        noShowRate: 15,
        bookingRate: 20,
        workDays: 21,
      },
      deals: [],
    },
    quarterTarget: { quarterLabel: currentQuarterLabel(), target: 150000 },
    yearTarget: { year: new Date().getFullYear(), target: 600000 },
    history: [],
  }
}
