import React, { useEffect, useRef, useState } from 'react';
import { useFormik } from 'formik';
import { useRouter } from 'next/router';
import Icon from '../icon/Icon';
import Input from '../bootstrap/forms/Input';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../bootstrap/Modal';
import { componentPagesMenu } from '../../menu';
import Button from '../bootstrap/Button';
import { findOverlappingEvents } from '../../common/function/overlapEvents';
import Card, { CardActions, CardBody, CardHeader, CardLabel, CardTitle } from '../bootstrap/Card';
import dayjs from 'dayjs';
import showNotification from '../extras/showNotification';

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
                        Overlapping Events Detected
                    </ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <div className="description">
                        <Icon icon="Info" color="danger" className="me-2" size="2x" />
                        <p className='h4 mb-5'>We’ve found events with overlapping times. Please review the following conflicts.</p>
                    </div>
                    {
                        overlappingEvents[0].map((event: any, i: number) => {
                            return (
                                <Card borderColor={"danger"} borderSize="2">
                                    <CardHeader>
                                        <CardLabel>
                                            <CardTitle>{event.name}</CardTitle>
                                        </CardLabel>
                                        {/* <CardActions>
                                            {}
                                        </CardActions> */}
                                    </CardHeader>
                                    <CardBody>
                                        <div className='row align-items-end'>
                                            <div className='col-lg-6'>
                                                <div className='h4 mb-3'>Start event</div>
                                                <span className='display-6 fw-bold text-danger'>{dayjs(event.start).format('H:mm')}</span>
                                                <span className='ms-3 fw-bold text-danger'>{dayjs(event.start).format('DD MMMM')}</span>
                                            </div>
                                            <div className='col-lg-6'>
                                                <div className='h4 mb-3'>End event</div>
                                                <span className='display-6 fw-bold text-success'>{dayjs(event.end).format('H:mm')}</span>

                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            );
                        })
                    }
                </ModalBody>
                <ModalFooter>
                    <Button
                        color="info"
                        onClick={() => setStatus(false)}
                    >
                        Close
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
};

export default OverlappingModal;
