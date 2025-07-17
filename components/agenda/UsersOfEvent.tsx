import Button from "../bootstrap/Button";
import Card, { CardHeader, CardLabel, CardTitle, CardBody, CardSubTitle } from "../bootstrap/Card";
import { delay } from "../../helpers/helpers";
import { useEffect, useState } from "react";
import Collapse from "../bootstrap/Collapse";
import Avatar from "../Avatar";
import Badge from "../bootstrap/Badge";
import Spinner from "../bootstrap/Spinner";

const UsersOfEvent = ({ id, token }: any) => {
    const userInIntraHandler = async (id: string) => {
        window.open(`https://profile.intra.42.fr/users/${id}`, "_blank");
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
              "/api/users_of_event?id=" + id,
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
                color="dark"
                isLight
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
                    users.map(({user}) => (
                        <Card isCompact >
                            
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

                            <div className='d-flex row align-items-end event_row m-3 mt-0'>
                                <div className='col-lg-6'>
                                    <Button
                                        className='h4'
                                        icon="People"
                                        color="light"
                                        type="submit"
                                        onClick={() => userInIntraHandler(user.id)}
                                    >View in intra
                                    </Button>
                                </div>
                                <div className='col-lg-6'>
                                    <div className='h4 text-end'>
                                        <Badge isLight color='primary'>
                                            {user.pool_month} {user.pool_year}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                                
                            </Card>
                    ))
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
