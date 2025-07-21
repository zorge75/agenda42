import { FC, useEffect, useState } from "react";
import OffCanvas, { OffCanvasHeader, OffCanvasTitle, OffCanvasBody } from "../bootstrap/OffCanvas";
import { RootState } from "../../store";
import { useDispatch, useSelector } from "react-redux";
import { setModalFriendsStatus } from "../../store/slices/settingsReducer";
import { alphabeticSort, delay, userInIntraHandler } from "../../helpers/helpers";
import Card, { CardHeader, CardLabel, CardTitle } from "../bootstrap/Card";
import Avatar from "../Avatar";
import Button from "../bootstrap/Button";
import Badge from "../bootstrap/Badge";
import useDarkMode from "../../hooks/useDarkMode";
import { removeFriendFromList } from "../../store/slices/friendsReducer";

const Friends: FC<any> = ({ token }: any) => {
    const friendsIsOpen = useSelector((state: RootState) => state.settings.friendsIsOpen);
    const me = useSelector((state: RootState) => state.user.me);
    const users = useSelector((state: RootState) => state.friends.list);
    const { darkModeStatus } = useDarkMode();

    const [success, setSuccess] = useState<number[]>([]);
    const [update, setUpdate] = useState(false);

    const dispatch = useDispatch();

    const setModal = (status: boolean) => {
        dispatch(setModalFriendsStatus(status));
    }

    const removeFriendHandler = async (id: number) => {
        setUpdate(true);
        await fetch("/api/friends", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: me.id,
                friend_id: id | 0
            }),
        }).then(async (response) => {
            setUpdate(false);
            if (!response.ok) {
                console.log(`Failed to create settings: ${response.statusText}`);
            } else {
                setSuccess((i: number[]) => [...i, id]);
                dispatch(removeFriendFromList(id))
                if (users.length == 1)
                    setModal(false);
            }
            return { success: true };
        })
    };

    if (!me)
        return;

    return (
        <OffCanvas
            setOpen={(status: boolean) => { setModal(status) }}
            isOpen={friendsIsOpen}
            titleId="canvas-title"
        >
            <OffCanvasHeader
                setOpen={(status: boolean) => { setModal(status) }}
                className="p-4"
            >
                <OffCanvasTitle id="canvas-title" className="h2">
                    Friends
                </OffCanvasTitle>
            </OffCanvasHeader>
            <OffCanvasBody tag="form" className="p-4" >
                {
                    alphabeticSort(users, "friend_login").map((user, key) => {
                        const isIdInSuccess = success && success.includes(user.id);
                        return (
                            <Card isCompact key={key} style={{ paddingBottom: 12 }} >
                                <CardHeader style={{ borderRadius: 20 }} >
                                    <CardLabel>
                                        <CardTitle>
                                            <Button
                                                style={{ marginRight: 20, marginBottom: 10 }}
                                                className='h4'
                                                icon={update ? "Refresh" : isIdInSuccess ? "Done" : "Close"}
                                                color={isIdInSuccess ? "success" : "danger"}
                                                isDisable={update}
                                                type="submit"
                                                onClick={() => removeFriendHandler(user.friend_id)}
                                            />
                                            <span style={{ marginRight: 10 }}>{user.friend_name}</span>
                                            <br />
                                            <Badge
                                                style={{ marginRight: 10 }}
                                                isLight={darkModeStatus ? false : true}
                                                color='success'
                                            >
                                                {user.friend_login}
                                            </Badge>
                                            <Badge
                                                style={{ marginRight: 10 }}
                                                isLight={darkModeStatus ? false : true}
                                                color='success'
                                            >
                                                {user?.pool_month} {user?.pool_year}
                                            </Badge>
                                        </CardTitle>
                                       
                                    </CardLabel>
                                    
                                        {user?.friend_image && <Avatar src={user?.friend_image} size={64} />}
                                </CardHeader>
                            </Card>
                        )
                    })
                }
            </OffCanvasBody>
        </OffCanvas>
    )
};

export default Friends;