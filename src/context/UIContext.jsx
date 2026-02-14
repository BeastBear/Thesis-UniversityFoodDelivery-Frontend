import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const DEFAULT_HEADER_TITLE = "Uni Eats";

const UIContext = createContext(null);

export const UIProvider = ({ children }) => {
  const [headerTitle, setHeaderTitle] = useState("");
  const [headerLoading, setHeaderLoading] = useState(false);

  const resetHeaderTitle = () => {
    setHeaderTitle("");
    setHeaderLoading(false);
  };

  const value = useMemo(
    () => ({
      headerTitle,
      headerLoading,
      setHeaderTitle,
      setHeaderLoading,
      resetHeaderTitle,
    }),
    [headerTitle, headerLoading],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
};

export const useHeaderTitle = (
  title,
  { loading = false, loadingText = "Loading...", resetOnUnmount = true } = {},
) => {
  const { setHeaderTitle, setHeaderLoading, resetHeaderTitle } = useUI();

  useEffect(() => {
    if (loading) {
      setHeaderLoading(true);
      setHeaderTitle(loadingText);
    } else if (title) {
      setHeaderLoading(false);
      setHeaderTitle(title);
    } else {
      setHeaderLoading(false);
      setHeaderTitle("");
    }

    return () => {
      if (resetOnUnmount) {
        resetHeaderTitle();
      }
    };
  }, [title, loading, loadingText, resetOnUnmount, setHeaderLoading, setHeaderTitle, resetHeaderTitle]);
};

export { DEFAULT_HEADER_TITLE };
