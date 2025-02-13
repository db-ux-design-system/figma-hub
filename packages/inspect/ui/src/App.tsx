import { DBBrand, DBHeader, DBPage, DBSection } from "@db-ux/react-core-components";
import Generate from "./pages/generate";
import "./index.css";
import "./highlight.css";

const App = () => {
  return (
    <DBPage
      variant="fixed"
      header={<DBHeader brand={<DBBrand>DBHeader</DBBrand>}></DBHeader>}
    >
      <DBSection spacing="none">
        <Generate />
      </DBSection>
    </DBPage>
  );
};

export default App;
