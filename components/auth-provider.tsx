"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string, remember: boolean) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string,
    remember: boolean
  ) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    // Import dynamique côté client uniquement : Firebase n'est jamais évalué
    // pendant le rendu serveur / prerender.
    void (async () => {
      try {
        const [{ auth }, { onAuthStateChanged }, { upsertParent }] =
          await Promise.all([
            import("@/lib/firebase"),
            import("firebase/auth"),
            import("@/lib/firestore-schema"),
          ]);

        if (!active) {
          return;
        }

        unsubscribe = onAuthStateChanged(auth, (nextUser) => {
          if (!active) {
            return;
          }

          setUser(nextUser);
          setLoading(false);

          if (nextUser) {
            void upsertParent(nextUser).catch(() => undefined);
          }
        });
      } catch {
        if (!active) {
          return;
        }

        setUser(null);
        setLoading(false);
      }
    })();

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async () => {
    const [{ auth, googleProvider }, { signInWithPopup }] = await Promise.all([
      import("@/lib/firebase"),
      import("firebase/auth"),
    ]);
    await signInWithPopup(auth, googleProvider);
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string, remember: boolean) => {
      const [
        { auth },
        {
          browserLocalPersistence,
          browserSessionPersistence,
          setPersistence,
          signInWithEmailAndPassword,
        },
      ] = await Promise.all([import("@/lib/firebase"), import("firebase/auth")]);

      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence
      );
      await signInWithEmailAndPassword(auth, email, password);
    },
    []
  );

  const signUpWithEmail = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      remember: boolean
    ) => {
      const [
        { auth },
        {
          browserLocalPersistence,
          browserSessionPersistence,
          createUserWithEmailAndPassword,
          setPersistence,
          updateProfile,
        },
      ] = await Promise.all([import("@/lib/firebase"), import("firebase/auth")]);

      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence
      );
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const trimmedName = displayName.trim();
      if (trimmedName) {
        await updateProfile(credential.user, { displayName: trimmedName });
      }
    },
    []
  );

  const resetPassword = useCallback(async (email: string) => {
    const [{ auth }, { sendPasswordResetEmail }] = await Promise.all([
      import("@/lib/firebase"),
      import("firebase/auth"),
    ]);
    await sendPasswordResetEmail(auth, email);
  }, []);

  const signOut = useCallback(async () => {
    const [{ auth }, { signOut: firebaseSignOut }] = await Promise.all([
      import("@/lib/firebase"),
      import("firebase/auth"),
    ]);
    await firebaseSignOut(auth);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  }

  return context;
}
