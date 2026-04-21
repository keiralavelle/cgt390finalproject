import { Suspense } from "react"; //<Suspense> boundary to pause rendering here until the search params are available
import AuthForm from "../../components/AuthForm";

const SignInPage = () => {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
};

export default SignInPage;