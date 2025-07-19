import { FC, useEffect, useState } from "react";
import OffCanvas, { OffCanvasHeader, OffCanvasTitle, OffCanvasBody } from "../bootstrap/OffCanvas";
import { RootState } from "../../store";
import { useDispatch, useSelector } from "react-redux";
import { setModalPiscineStatus } from "../../store/slices/settingsReducer";
import { delay, userInIntraHandler } from "../../helpers/helpers";
import Card, { CardHeader, CardLabel, CardTitle } from "../bootstrap/Card";
import Avatar from "../Avatar";
import Button from "../bootstrap/Button";
import Spinner from "../bootstrap/Spinner";
import Badge from "../bootstrap/Badge";
import useDarkMode from "../../hooks/useDarkMode";
import { addFriendToList } from "../../store/slices/friendsReducer";

const Piscine: FC<any> = ({ token }: any) => {
    const piscineIsOpen = useSelector((state: RootState) => state.settings.piscineIsOpen);
    const me = useSelector((state: RootState) => state.user.me);
    const { darkModeStatus } = useDarkMode();

    const dispatch = useDispatch();

    const setModal = (status: boolean) => {
        dispatch(setModalPiscineStatus(status));
    }

    const [refresh, setRefresh] = useState(false);
    const [signSort, setSignSort] = useState(false);
    const [users, setUsers] = useState([]);
    const [success, setSuccess] = useState<number[]>([]);
    const [update, setUpdate] = useState(false);


    const getMyPiscine = async () => {
        const maxRetries = 3; // Maximum number of retry attempts
        let retryCount = 0;

        const attemptRefresh = async () => {
            setRefresh(true);

            const res = await fetch(
                `/api/piscine`
                + `?year=${me.pool_year}`
                + `&month=${me.pool_month}`
                + `&signSort=${signSort ? "" : "-"}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const response = await res.json();

            if (res.ok) {
                setUsers(response);
                console.log("piscine", response);
                // Success case
            } else if (res.status === 429 && retryCount < maxRetries) {
                // Handle 429 error with retry
                retryCount++;
                const retryAfter = res.headers.get('Retry-After')
                    ? parseInt(res.headers.get('Retry-After')) * 1000
                    : 5000 * retryCount; // Default to 5s, 10s, 15s

                console.log(`Rate limited. Retrying after ${retryAfter / 1000} seconds...`);
                await delay(retryAfter);
                // return await attemptRefresh(); // Recursive retry
            } else {
                return;
            }
            setRefresh(false);
            await delay(3000);
        };

        await attemptRefresh();
    };

    const addFriendHandler = async (id: number, login: string, name: string, image: string, month: string, year: string) => {
        setUpdate(true);
        await fetch("/api/friends", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: me.id,
                friend_id: id,
                friend_login: login,
                friend_name: name,
                friend_image: image,
                pool_month: month,
                pool_year: year,
            }),
        }).then(async (response) => {
            setUpdate(false);
            if (!response.ok) {
                console.log(`Failed to create settings: ${response.statusText}`);
            } else {
                setSuccess((i: number[]) => [...i, id]);
                dispatch(addFriendToList(
                    {
                        user_id: me.id,
                        friend_id: id,
                        friend_login: login,
                        friend_name: name,
                        friend_image: image,
                        pool_month: month,
                        pool_year: year,
                    }
                ));
            }
            return { success: true };
        })
    };

    useEffect(() => {
        getMyPiscine();
    }, [signSort])

    if (!me || !users)
        return;

    return (
        <OffCanvas
            setOpen={(status: boolean) => { setModal(status) }}
            isOpen={piscineIsOpen}
            titleId="canvas-title"
        >
            <OffCanvasHeader
                setOpen={(status: boolean) => { setModal(status) }}
                className="p-4"
            >
                <OffCanvasTitle id="canvas-title" className="h2">
                    Pool: {me.pool_month} {me.pool_year}
                </OffCanvasTitle>
            </OffCanvasHeader>
            <Button
                className='h4 m-4'
                icon={signSort ? "Sort" : "Star"}
                color="light"
                onClick={() => setSignSort(!signSort)}
            >Sort with parameter 'updated_at'
            </Button>
            <OffCanvasBody tag="form" className="p-4" >
                {
                    refresh
                        ? <Spinner random />
                        : <>
                            {
                                users.map(user => {
                                    const isIdInSuccess = success && success.includes(user.id);
                                    return (
                                        <Card isCompact >
                                            <CardHeader style={{ borderRadius: 20 }} >
                                                <CardLabel>
                                                    <CardTitle>
                                                        {user.usual_first_name || user.first_name}
                                                    </CardTitle>
                                                    <div style={{ display: 'table-caption', marginTop: 10 }}>
                                                        <Badge
                                                            isLight={darkModeStatus ? false : true}
                                                            className="mb-2"
                                                            color='primary'
                                                        >
                                                            Wallet:     {user.wallet} ₳
                                                        </Badge>
                                                        <Badge
                                                            isLight={darkModeStatus ? false : true}
                                                            color='success'
                                                        >
                                                            {user.login}
                                                        </Badge>
                                                    </div>
                                                </CardLabel>
                                                <Avatar src={user.image.versions.medium} size={64} />

                                            </CardHeader>

                                            <div className='d-flex row align-items-end event_row m-3 mt-0'>
                                                <div className='col-lg-6 p-1'>
                                                    <Button
                                                        style={{ marginRight: 15 }}
                                                        className='h4'
                                                        icon={update ? "Refresh" : isIdInSuccess ? "Done" : "Add"}
                                                        color={isIdInSuccess ? "success" : "light"}
                                                        isDisable={update}
                                                        type="submit"
                                                        onClick={() => addFriendHandler(user.id, user.login, user.first_name, user.image.versions.medium, user.pool_month, user.pool_year)}
                                                    />
                                                    <Button
                                                        className='h4'
                                                        icon="Link"
                                                        color="light"
                                                        type="submit"
                                                        onClick={() => userInIntraHandler(user.id)}
                                                    >intra
                                                    </Button>
                                                </div>
                                                <div className='col-lg-6'>
                                                    <div className='h4 text-end'>
                                                        <Badge
                                                            isLight={darkModeStatus ? false : true}
                                                            color={'piscine'}
                                                        >
                                                            {user.pool_month} {user.pool_year}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    )
                                })
                            }
                        </>
                }
            </OffCanvasBody>
        </OffCanvas>
    )
};

export default Piscine;