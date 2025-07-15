import React, { useEffect, useState } from 'react';
import Icon from '../icon/Icon';
import Modal, { ModalBody, ModalHeader, ModalTitle } from '../bootstrap/Modal';
import { findOverlappingEvents } from '../../common/function/overlapEvents';
import Card, { CardBody, CardHeader, CardLabel, CardTitle } from '../bootstrap/Card';
import dayjs from 'dayjs';

const OverlappingModal = ({
    events
}: any) => {
    const [status, setStatus] = useState(false);
    const overlappingEvents = findOverlappingEvents(events) || [];

    useEffect(() => {
        if (overlappingEvents)
            setStatus(true);
    }, []);

    if (!overlappingEvents.length) {
        return (null);
    }

    return (
        <div className="overlapping">
            <Modal
                id="example-modal"
                isOpen={status}
                setIsOpen={setStatus}
                titleId="example-title"
            >
                <ModalHeader>
                    <ModalTitle id="example-title">
                        <Icon icon="Info" color="danger" className="me-2" size="2x" />
                        Overlapping Events Detected
                    </ModalTitle>
                </ModalHeader>
                <ModalBody onClick={() => setStatus(false)}>
                    {overlappingEvents[0].map((event: any, i: number) => {
                        return (
                            <Card borderColor={"danger"} >
                                <CardHeader style={{ paddingBottom: 0, minHeight: 0 }} >
                                    <CardLabel>
                                        <CardTitle>{event.name}</CardTitle>
                                    </CardLabel>
                                    {/* <CardActions>
                                            {}
                                        </CardActions> */}
                                </CardHeader>
                                <CardBody>
                                    <div className='row align-items-end colomn_rest'>
                                        <div className='col-lg-6' style={{ width: '50%' }}>
                                            <div className='h6 mb-3'>Start event</div>
                                            <span className='display-6 fw-bold text-danger'>{dayjs(event.start).format('H:mm')}</span>
                                            <span className='ms-3 fw-bold text-danger'>{dayjs(event.start).format('DD MMMM')}</span>
                                        </div>
                                        <div className='col-lg-6' style={{ width: '50%' }}>
                                            <div className='h6 mb-3'>End event</div>
                                            <span className='display-6 fw-bold text-success'>{dayjs(event.end).format('H:mm')}</span>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        );
                    })
                    }
                </ModalBody>
            </Modal>
        </div>
    );
};

export default OverlappingModal;
