import { DBBrand, DBHeader, DBPage, DBSection } from "@db-ux/react-core-components";
import Migration from "./pages/migration";
import "./index.css";

const App = () => {
  return (
    <DBPage
      variant="fixed"
      header={<DBHeader brand={<DBBrand>Migration tool</DBBrand>}></DBHeader>}
    >
      <DBSection spacing="none">
        <Migration />
      </DBSection>
    </DBPage>
  );
};

export default App;
