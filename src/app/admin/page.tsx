import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import db from "@/db/db";
import { formatCurrency, formatNumber } from "@/lib/formatters";

async function getSales() {
  const data = await db.order.aggregate({
    _sum: { pricePaid: true },
    _count: true,
  });
  return { amount: data._sum.pricePaid || 0, numberOfSales: data._count };
}

async function getUsers() {
  const [userCount, orders] = await Promise.all([
    db.user.count(),
    db.order.aggregate({
      _sum: { pricePaid: true },
    }),
  ]);

  return {
    userCount,
    avgValPerUser:
      userCount === 0 ? 0 : (orders._sum.pricePaid || 0) / userCount,
  };
}

async function getProducts() {
  const [active, inactive] = await Promise.all([
    db.product.count({ where: { isAvailable: true } }),
    db.product.count({ where: { isAvailable: false } }),
  ]);
  return { active, inactive };
}

type DashboardCardProps = {
  title: string;
  subtitle: string;
  body: string;
};

function DashboardCard({ title, subtitle, body }: DashboardCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}

export default async function AdminDashboard() {
  const [salesData, usersData, productsData] = await Promise.all([
    getSales(),
    getUsers(),
    getProducts(),
  ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <DashboardCard
        title="Productos"
        subtitle={`${formatNumber(productsData.inactive)} Inactivos`}
        body={`${formatNumber(productsData.active)}`}
      />

      <DashboardCard
        title="Clientes"
        subtitle={`${formatCurrency(
          usersData.avgValPerUser
        )} Promedio por cliente`}
        body={`${formatNumber(usersData.userCount)} Clientes`}
      />

      <DashboardCard
        title="Pedidos"
        subtitle={`${formatNumber(salesData.numberOfSales)} Pedidos`}
        body={formatCurrency(salesData.amount)}
      />
    </div>
  );
}
