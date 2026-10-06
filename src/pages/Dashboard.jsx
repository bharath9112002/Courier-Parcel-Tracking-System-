import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import QuickActions from '../components/dashboard/QuickActions'
import RecentActivity from '../components/dashboard/RecentActivity'
import StatTile from '../components/dashboard/StatTile'
import SuccessRateCard from '../components/dashboard/SuccessRateCard'
import { useAuth } from '../context/AuthContext'
import { generateMockData } from '../data/mockData'
import { computeDashboardStats, recentActivities } from '../utils/dashboardStats'
import { formatDate, formatNumber, greeting } from '../utils/format'

export default function Dashboard() {
  const { user } = useAuth()

  // Snapshot taken once per visit, so figures don't shift while the page is open.
  const [{ stats, activities, now }] = useState(() => {
    const now = Date.now()
    const data = generateMockData(now)
    return {
      now,
      stats: computeDashboardStats(data, now),
      activities: recentActivities(data.shipments),
    }
  })

  return (
    <main className="page">
      <header className="page__head">
        <div>
          <p className="page__eyebrow">
            <Icon name="calendar" size={15} />
            {formatDate(now, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1>{greeting(new Date(now))}, {user.name.split(' ')[0]} 👋</h1>
          <p className="muted">Here&apos;s what&apos;s happening with your deliveries today.</p>
        </div>
        <Link to="/shipments/new" className="btn btn--primary btn--auto">
          <Icon name="plus" size={18} />
          New shipment
        </Link>
      </header>

      <section className="stats-grid" aria-label="Key figures">
        <StatTile
          label="Total shipments"
          value={stats.totalShipments.value}
          icon="package"
          tone="primary"
          delta={stats.totalShipments.delta}
          deltaLabel="vs last week"
          trend={stats.totalShipments.trend}
          trendUnit="booked"
        />
        <StatTile
          label="In transit"
          value={stats.inTransit.value}
          icon="truck"
          tone="info"
          note={`${formatNumber(stats.inTransit.outForDelivery)} out for delivery`}
        />
        <StatTile
          label="Delivered"
          value={stats.delivered.value}
          icon="check"
          tone="success"
          delta={stats.delivered.delta}
          deltaLabel="vs last week"
          trend={stats.delivered.trend}
          trendUnit="delivered"
        />
        <StatTile
          label="Pending deliveries"
          value={stats.pending.value}
          icon="clock"
          tone="warning"
          note="Awaiting pickup"
        />
        <StatTile
          label="Total customers"
          value={stats.customers.value}
          icon="users"
          tone="violet"
          note={`+${formatNumber(stats.customers.newThisWeek)} new this week`}
        />
        <StatTile
          label="Today's shipments"
          value={stats.today.value}
          icon="calendar"
          tone="pink"
          delta={stats.today.delta}
          deltaLabel="vs yesterday"
          trend={stats.today.trend}
          trendUnit="booked"
        />
      </section>

      <QuickActions />

      <div className="dashboard-split">
        <SuccessRateCard {...stats.successRate} />
        <RecentActivity items={activities} now={now} />
      </div>
    </main>
  )
}
