import Button from "../bootstrap/Button";
import Card, { CardHeader, CardLabel, CardTitle, CardBody, CardSubTitle } from "../bootstrap/Card";
import { delay, getName, isMyPiscine, userInIntraHandler } from "../../helpers/helpers";
import { useEffect, useState } from "react";
import Collapse from "../bootstrap/Collapse";
import Avatar from "../Avatar";
import Badge from "../bootstrap/Badge";
import Spinner from "../bootstrap/Spinner";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import useDarkMode from "../../hooks/useDarkMode";
import Link from "next/dist/client/link";
import showNotification from "../extras/showNotification";
import Icon from "../icon/Icon";
import Tooltips from "../bootstrap/Tooltips";
import { addFriendToList } from "../../store/slices/friendsReducer";
import Shapes from "../shapes/Shapes";

const UsersOfEvent = ({ myId, id, size = 30, token }: any) => {
    const dispatch = useDispatch();

    const me = useSelector((state: RootState) => state.user.me);
    const friends = useSelector((state: RootState) => state.friends.list);
    const [success, setSuccess] = useState<number[]>([]);
    const [update, setUpdate] = useState(false);

    const { darkModeStatus } = useDarkMode();

    const addFriendHandler = async (id: number, login: string, name: string, image: string, month: string, year: string) => {
        setUpdate(true);
        await fetch("/api/friends", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: myId,
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
                        user_id: myId,
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

    const [refresh, setRefresh] = useState(false);
    const [users, setUsers] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    const getUsersOfEvent = async () => {
        const maxRetries = 3; // Maximum number of retry attempts
        let retryCount = 0;

        const attemptRefresh = async () => {
            setRefresh(true);

            console.log("*", users.length, refresh, isOpen)

            const res = await fetch(
                "/api/users_of_event?id=" + id + "&size=" + size,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const response = await res.json();

            if (res.ok) {
                setUsers(response);
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

    useEffect(() => {
        getUsersOfEvent();
    }, [])

    if (!refresh && users.length == 0)
        return ("");

    return (
        <>
            <Button
                isDisable={refresh || users.length <= 0}
                color={darkModeStatus ? "light" : "dark"}
                isLight={darkModeStatus ? false : true}
                onClick={() => setIsOpen(!isOpen)}
                className="mb-3"
            >
                {
                    refresh || users.length <= 0
                        ? <Spinner isSmall />
                        : "Users registered for this event"
                }
            </Button>
            <Collapse
                tag="div"
                isOpen={isOpen}
            >
                {
                    users.map(({ user, key }) => {
                        const isIdInSuccess = success && success.includes(user.id);
                        const isFriend = friends.find(i => i.friend_id == user.id);
                        return (
                            <Card isCompact key={key}
                                className={isFriend ? "friend" : ""}
                            >

                                <CardHeader
                                    style={{ borderRadius: 20 }}
                                >

                                    <CardLabel
                                    >
                                        <CardTitle>
                                            {user.usual_full_name}
                                        </CardTitle>
                                        <p className="mt-2" >{user.email}</p>
                                    </CardLabel>
                                    <Avatar src={user.image.versions.medium} size={64} />
                                </CardHeader>

                                <div className='card-aside d-flex row align-items-end event_row m-3 mt-0'>
                                    <div className='col-lg-6 p-1'>
                                        <Button
                                            style={{ marginRight: 15 }}
                                            className='h4'
                                            icon={update ? "Refresh" : (isFriend || isIdInSuccess) ? "Group": "Add"}
                                            color={(isIdInSuccess || isFriend) ? "success" : "light"}
                                            isDisable={update || isFriend}
                                            type="submit"
                                            onClick={() => addFriendHandler(user.id, user.login, getName(user), user.image.versions.medium, user.pool_month, user.pool_year)}
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
                                                color={isMyPiscine(me, user) ? 'piscine' : 'primary'}
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
                {
                    users.length === 100
                        ? <Link style={{
                            margin: '40px auto',
                            display: 'flex',
                            width: 'max-content',
                        }} href="https://github.com/brgman/agenda42/issues/66">Loaded just 100 last students...</Link>
                        : null
                }
                <Button
                    color="dark"
                    isLight
                    onClick={() => setIsOpen(!isOpen)}
                    className="mb-3 w-100"
                >
                    Hide users
                </Button>
            </Collapse>
        </>
    );
};

export default UsersOfEvent;
