import AccountList from "./components/AccountList";

function AccountsPage() {
  return (
    <div className="grid grid-cols-1 gap-4">
      <h1 className="pt-2 font-display text-2xl">Cuentas</h1>
      <AccountList />
    </div>
  );
}

export default AccountsPage;
