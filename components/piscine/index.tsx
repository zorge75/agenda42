import { FC, useEffect, useState } from "react";
import OffCanvas, { OffCanvasHeader, OffCanvasTitle, OffCanvasBody } from "../bootstrap/OffCanvas";
import { RootState } from "../../store";
import { useDispatch, useSelector } from "react-redux";
import { setModalPiscineStatus } from "../../store/slices/settingsReducer";
import FormGroup from "../bootstrap/forms/FormGroup";
// import { Badge, Input, Label } from "../icon/material-icons";
import { setDate } from "date-fns";
import Button from "../bootstrap/Button";
import Checks, { ChecksGroup } from "../bootstrap/forms/Checks";
import { useFormik } from "formik";
import validate from "../../common/function/validation/editPagesValidate";
import dayjs from "dayjs";
import FormText from "../bootstrap/forms/FormText";
import TAGS from "../../common/data/boardTagsData";
import Card, { CardHeader, CardLabel, CardTitle, CardBody } from "../bootstrap/Card";
import Select from "../bootstrap/forms/Select";
import Textarea from "../bootstrap/forms/Textarea";
import Modal, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from "../bootstrap/Modal";
import Input from "../bootstrap/forms/Input";
import Icon from "../icon/Icon";
import showNotification from "../extras/showNotification";

const Piscine: FC<any> = ({ isLoaded }: any) => {
    const piscineIsOpen = useSelector((state: RootState) => state.settings.piscineIsOpen);
    const me = useSelector((state: RootState) => state.user.me);

    const dispatch = useDispatch();

    const setSettings = (status: boolean) => {
        dispatch(setModalPiscineStatus(status));
    }

    return (
        <OffCanvas
            setOpen={(status: boolean) => {
                setSettings(status);
            }}
            isOpen={piscineIsOpen}
            titleId="canvas-title"
        >
            <OffCanvasHeader
                setOpen={(status: boolean) => {
                    setSettings(status);
                }}
                className="p-4"
            >
                <OffCanvasTitle id="canvas-title">
                    Personal settings
                </OffCanvasTitle>
            </OffCanvasHeader>
            <OffCanvasBody
                tag="form"
                // onSubmit={formik.handleSubmit}
                className="p-4"
            >
                Piscine:
            </OffCanvasBody>
        </OffCanvas>
    )
};

export default Piscine;