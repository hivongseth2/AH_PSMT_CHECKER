import { useState, useCallback } from "react";

export const useForceUpdate = () => {
  const [, setState] = useState({});
  return useCallback(() => setState({}), []);
};
