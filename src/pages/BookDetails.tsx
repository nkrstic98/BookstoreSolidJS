import {Component, createSignal, For, onMount, Show} from "solid-js";
import {useNavigate, useParams} from "@solidjs/router";
import {Book, BookComment, bookModel} from "../models/books";
import {Col, Container, Form, Modal, Row, Tab, Tabs} from "solid-bootstrap";
import {User} from "../models/users";
import {createStore} from "solid-js/store";
import {Button} from "solid-bootstrap";
import {FormGroup, InputGroup} from "solid-bootstrap";

type CommentForm = {
    grade: string;
    title: string;
    username: string;
    text: string;
    date: string;
}

const commentForm = () => {
    const { commentBook } = bookModel();

    const [form, setForm] = createStore<CommentForm>({
        grade: "5",
        title: "",
        username: "",
        text: "",
        date: "",
    });

    const parseDate = (submissionDate: Date) => {
        let date = submissionDate.getDate();
        let month = submissionDate.getMonth();
        let year = submissionDate.getFullYear();

        let returnDate = "";

        returnDate += date < 10 ? "0" + date : date;
        returnDate += ".";
        returnDate += month < 10 ? "0" + month : month;
        returnDate += ".";
        returnDate += year < 10 ? "0" + year : year;
        returnDate += ".";

        return returnDate;
    }

    const submit = (bookId: number, username: string, form: CommentForm) => {
        let bookComment: BookComment = {
            date: parseDate(new Date()),
            title: form.title,
            username: username,
            grade: parseInt(form.grade, 10),
            text: form.text,
        }
        return commentBook(bookId, bookComment);
    }

    const clearField = (fieldName: string) => {
        setForm({
            [fieldName]: ""
        });
    };

    const updateFormField = (fieldName: string) => (event: Event) => {
        const inputElement = event.currentTarget as HTMLInputElement;
        if (inputElement.type === "checkbox") {
            setForm({
                [fieldName]: inputElement.checked
            });
        } else {
            setForm({
                [fieldName]: inputElement.value
            });
        }
    };

    return { form, setForm, submit, updateFormField, clearField };
}

const BookDetails: Component = () => {
    const [commentList, setCommentList] = createStore<BookComment[]>([]);

    const navigation = useNavigate();
    const {getBookById, togglePromotion} = bookModel();

    const [username, setUsername] = createSignal<string>("");
    const [userType, setUserType] = createSignal<string>("");
    const [book, setBook] = createSignal<Book>({
        id: NaN,
        title: "",
        author: "",
        description: "",
        image: "",
        yearPublished: "",
        numberOfPages: "",
        averageGrade: 0,
        commentList:[],
        isOnPromotion: false
    });
    const [bookGrade, setBookGrade] = createSignal(0);

    const { form, submit, updateFormField, clearField } = commentForm();
    const [validated, setValidated] = createSignal(false);

    const [show, setShow] = createSignal(false);
    const handleOpen = () => setShow(true);
    const handleClose = () => setShow(false);

    const [isRecommendModal, setIsRecommendModal] = createSignal(false);

    const fetchUser = () => {
        let fetchedUser = localStorage.getItem("user");
        if(fetchedUser != null) {
            let user: User = JSON.parse(fetchedUser);
            setUserType(user.type);
            setUsername(user.username);
        }
    }

    onMount(() => {
        fetchUser();

        let params = useParams();
        let bookId = parseInt(params.id, 10);
        if (isNaN(bookId)) {
            navigation("/");
            return;
        }

        let book = getBookById(bookId);
        if(book == undefined) {
            navigation("/");
            return;
        }

        setBook(book);
        setCommentList(book.commentList);
        setBookGrade(book.averageGrade / book.commentList.length);
    })

    const handleSubmit = (event: SubmitEvent) => {
        const f = event.currentTarget;
        event.preventDefault();
        if (!(f as HTMLFormElement).checkValidity()) {
            event.stopPropagation();
            setValidated(true);
        }
        else {
            let updatedBook = submit(book().id, username(), form);

            setCommentList(updatedBook.commentList);
            setBook(updatedBook);
            setBookGrade(updatedBook.averageGrade / updatedBook.commentList.length);

            clearField("title");
            clearField("text");
            setValidated(false);
            handleClose();
        }
    };

    return (
        <>
            <Modal show={show()} onHide={handleClose}>
                <Form noValidate validated={validated()} onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Vaše mišljenje nam veoma znači</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <FormGroup controlId="validationCustomGrade">
                            <Form.Label>Ocena</Form.Label>
                            <Form.Select onChange={updateFormField("grade")}>
                                <option value={"5"}>5</option>
                                <option value={"4"}>4</option>
                                <option value={"3"}>3</option>
                                <option value={"2"}>2</option>
                                <option value={"1"}>1</option>
                            </Form.Select>
                        </FormGroup>
                        <Form.Group class="mt-4" controlId="validationCustomTitle">
                            <Form.Label>Komentar</Form.Label>
                            <InputGroup hasValidation>
                                <Form.Control
                                    type="text"
                                    placeholder="Naslov komentara"
                                    value={form.title}
                                    onChange={updateFormField("title")}
                                    required
                                />
                                <Form.Control.Feedback type="invalid">
                                    Molimo Vas unesite naslov komentara
                                </Form.Control.Feedback>
                            </InputGroup>
                        </Form.Group>
                        <Form.Group controlId="validationCustomText" class="mt-3">
                            <InputGroup hasValidation>
                                <Form.Control
                                    as="textarea"
                                    rows={6}
                                    placeholder="Unesite tekst komentara..."
                                    value={form.text}
                                    onChange={updateFormField("text")}
                                    required
                                />
                                <Form.Control.Feedback type="invalid">
                                    Molimo Vas unesite tekst komentara
                                </Form.Control.Feedback>
                            </InputGroup>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleClose}>Odustani</Button>
                        <Button variant="success" type="submit">Pošalji</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Container style={"margin-top: 40px;text-align:center;"}>
                <Row>
                    <Col>
                        <img src={"/src/assets/books/" + book().image + ".jpeg"} alt={book().image} style={"height:350px"}/>
                        <div class="mt-4 mb-4">
                            <div>
                                <span class="fa fa-star" style={bookGrade() >= 1 ? "color: orange" : "color: black"}/>
                                <span class="fa fa-star" style={bookGrade() >= 2 ? "color: orange" : "color: black"}/>
                                <span class="fa fa-star" style={bookGrade() >= 3 ? "color: orange" : "color: black"}/>
                                <span class="fa fa-star" style={bookGrade() >= 4 ? "color: orange" : "color: black"}/>
                                <span class="fa fa-star" style={bookGrade() >= 5 ? "color: orange" : "color: black"}/>
                            </div>
                            <span><span style="font-weight:bold;">Godina izdanja: </span>{book().yearPublished}</span> <br/>
                            <span><span style="font-weight:bold;">Broj strana: </span>{book().numberOfPages}</span> <br/>
                            <span><span style="font-weight:bold;">Format: </span>13x20 cm</span> <br/>
                            <span><span style="font-weight:bold;">Pismo: </span>Latinica</span> <br/>
                            <span><span style="font-weight:bold;">Povez: </span>Mek</span>
                        </div>

                        <Show when={userType() != ""}>
                            <Show when={userType() == "admin"} fallback={
                                <button class="btn btn-outline-success"
                                        onClick={() => {
                                            handleOpen();
                                            setIsRecommendModal(true);
                                        }
                                }>
                                    Preporuči knjigu
                                </button>
                            }>
                                <Form>
                                    <Show when={book().isOnPromotion} fallback={<button type="submit" class="btn btn-outline-success" onClick={() => togglePromotion(book().id)}>Postavi promociju</button>}>
                                        <button class="btn btn-outline-danger" type="submit" onClick={() => togglePromotion(book().id)}>Ukloni promociju</button> <br/>
                                    </Show>
                                </Form>
                            </Show>
                        </Show>
                    </Col>
                    <Col xs={8}>
                        <Tabs defaultActiveKey="about" id="uncontrolled-tab-example" class="mb-3">
                            <Tab eventKey="about" title="O knjizi">
                                <div style={"font-size:15px;"} innerHTML={book().description} class="p-4"/>
                            </Tab>
                            <Tab eventKey="comments" title="Komentari">
                                <Show when={commentList.length == 0}>
                                    <div class="mt-3" style={"font-style:italic;"}>
                                        <p>Još uvek nema komentara za ovu knjigu...</p>
                                    </div>
                                </Show>
                                <Show when={username() != "" && userType() != "admin"}>
                                    <button class="btn btn-primary"
                                            onClick={() => {
                                                handleOpen();
                                                setIsRecommendModal(false);
                                            }
                                            }>
                                        Dodaj komentar
                                    </button>
                                </Show>
                                <For each={commentList}>{comment =>
                                    <>
                                        <div class="p-4" style="text-align: left;">
                                            <span style="font-size: 12px">{comment.date}</span> <br/>
                                            <span style="font-size: 16px">{comment.title}</span> <br/>
                                            <span  style="font-size: 16px; font-weight: bold;">{comment.username}</span> <br/>
                                            <span class="fa fa-star" style={comment.grade >= 1 ? "color: orange" : "color: black"}/>
                                            <span class="fa fa-star" style={comment.grade >= 2 ? "color: orange" : "color: black"}/>
                                            <span class="fa fa-star" style={comment.grade >= 3 ? "color: orange" : "color: black"}/>
                                            <span class="fa fa-star" style={comment.grade >= 4 ? "color: orange" : "color: black"}/>
                                            <span class="fa fa-star" style={comment.grade >= 5 ? "color: orange" : "color: black"}/> <br/>
                                            <span style="font-size: 14px;">{comment.text}</span>
                                        </div>
                                        <hr/>
                                    </>
                                }</For>
                            </Tab>
                        </Tabs>
                    </Col>
                </Row>
            </Container>
        </>
    )
}

export default BookDetails;