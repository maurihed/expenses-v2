import { useParams } from "react-router";

function InvestmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <div className="pt-2">Detalle de inversión {id}</div>;
}

export default InvestmentDetailPage;
