import { SignUp } from "@clerk/clerk-react";
import React from "react";

function Register() {
  return (
    <div class="flex items-center justify-center h-screen">
      <div class="p-6 bg-white rounded-lg shadow-lg">
        <SignUp mode="modal" fallbackRedirectUrl={"/"} />
      </div>
    </div>
  );
}

export default Register;
