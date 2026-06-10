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
      const [{ auth }, { onAuthStateChanged }, { upsertParent }] =
        await Promise.all([
          import("@/lib/firebase"),
          import("firebase/auth"),
          import("@/lib/firestore-schema"),
        ]);

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

  const signOut = useCallback(async () => {
    const [{ auth }, { signOut: firebaseSignOut }] = await Promise.all([
      import("@/lib/firebase"),
      import("firebase/auth"),
    ]);
    await firebaseSignOut(auth);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
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
