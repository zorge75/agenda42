import languages from "../../common/data/languages";
import Badge from "../bootstrap/Badge";

export const CorrectorLanguages = ({ id, users = null }: { id: any; users: any; }) => (
    users.filter((i: any) => i.id == id)[0]?.languages
        ?.map((i: any) => (<span style={{ marginRight: 10 }} >
            {languages.filter(j => i.language_id == j.id)[0].code}
        </span>))
);

export const CorrectorGrades = ({ id, users = null }: { id: any; users: any; }) => (
    users.filter((i: any) => i.id == id)[0]?.grade
        ?.map((i: any) => {
            if (i.grade) {
                return (
                    <Badge color="dark" style={{ marginRight: 10, marginTop: 10 }}>
                            {i.grade}: {i.level}
                    </Badge>)
            }
        }
        )
);