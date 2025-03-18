import { useEffect, useState } from "react";
import { fetchUserWithRetry } from "../../common/function/getScaleTeams";
import Button from "../bootstrap/Button";
import Spinner from "../bootstrap/Spinner";

export const CorrectorLocation = ({ id, token }: { id: any; token: any }) => {
    const [userData, setUserData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            const data = await fetchUserWithRetry(id, 3, token, false);
            setUserData(data);
        };
        fetchData();
    }, [id, token]);

    const getLinkForFriends42 = (i: any) => {
        const claster = i.location.split("-")[0];
        const etage = i.location.split("-")[1].slice(0, 2);
        return `https://friends.42paris.fr/?cluster=${claster}-${etage}&p=${i.location}`;
    };

    return (
        <>
            {
                userData?.location ? (
                    <Button
                        style={{ filter: "drop-shadow(0 5px 1.5rem #e33d94)" }}
                        color="storybook"
                        type="submit"
                        onClick={() => {
                            window.open(getLinkForFriends42(userData), '_blank');
                        }}
                    >
                        Show on Friends42
                    </Button>
                ) : (
                    <Button
                        disabled
                        type="submit"
                        onClick={() => { }}
                    >
                        {userData?.id ? "Unavailable" : "Reload..."}
                    </Button>
                )
            }
        </>
    );
};