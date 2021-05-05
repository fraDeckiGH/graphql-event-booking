import { IsEmail, Length } from "class-validator";
import { Maybe } from "../util";

export default class User/* <T> */ {
  // TODO I want this field to be:
  // required
  // unique (case INsensitive)
  @IsEmail()
  email!: string
  // email: Maybe<string> = undefined
  
  // TODO I want this field to be:
  // required but sparse
  // unique (case sensitive)
  nickname!: string
  
  @Length(8, 20)
  password!: string
  
  constructor();
  constructor({
    obj,
    objKeys,
  }: {
    obj: any,
    objKeys: string[],
  } | void) {
    // objKeys.forEach((key: string) => {
    //   (this as any)[key] = obj.key
    // })
  }
  
}
