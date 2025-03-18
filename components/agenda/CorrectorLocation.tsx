import { useEffect, useState } from "react";
import { fetchUserWithRetry } from "../../common/function/getScaleTeams";
import Button from "../bootstrap/Button";

export const CorrectorLocation = ({ id, token = null, user = null }: { id: any; token: any; user: any }) => {
    const [userData, setUserData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            const data = await fetchUserWithRetry(id, 3, token, false);
            setUserData(data);
        };
        if (!user)
            fetchData();
        else
            setUserData(user);
    }, [id, token]);

    const getLinkForFriends42 = (i: any) => {
        const claster = i.location.split("-")[0];
        const etage = i.location.split("-")[1].slice(0, claster == 'made' ? 3 : 2);
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