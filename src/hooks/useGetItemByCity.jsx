import React, { useEffect } from "react";
import { serverUrl } from "../App";
import { useDispatch, useSelector } from "react-redux";
import { setItemsInMyCity } from "../redux/userSlice";
import axios from "axios";

function useGetItemsByCity() {
  const dispatch = useDispatch();
  const { currentCafeteria } = useSelector((state) => state.user);
  useEffect(() => {
    if (!currentCafeteria) return;
    const fetchItems = async () => {
      try {
        const result = await axios.get(
          `${serverUrl}/api/item/get-by-city/${currentCafeteria}`,
          {
            withCredentials: true,
          },
        );
        dispatch(setItemsInMyCity(result.data));
      } catch (error) {

      }
    };
    fetchItems();
  }, [currentCafeteria]);
}

export default useGetItemsByCity;
