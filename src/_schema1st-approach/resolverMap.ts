import { query as q } from "faunadb";
import { fieldsList, fieldsMap } from "graphql-fields-list";
import { packCursor, packQueryError, parseCursor } from "../node";
import { Context } from "../node";
import { INDEXING_FIELD, SELECT_DEFAULT_VALUE } from "../node";

const {
  Abort,
  Add,
  Call,
  Collection,
  Collections,
  Contains,
  Create,
  Do,
  Documents,
  Exists,
  Get,
  Identity,
  If,
  Index,
  Join,
  Lambda,
  Let,
  Match,
  Merge,
  Not,
  Now,
  Paginate,
  Ref,
  Select,
  Subtract,
  ToArray,
  Update,
  Var,
} = q;

// resolver map
export default {
  Mutation: {
    createEvent: async (
      parent: any,
      args: any,
      ctx: Context,
      info: any
    ) => {
      const { jsonInput } = args;
      const { db } = ctx;

      db.query(
        Create(Collection("event"), {
          data: jsonInput,
        })
      ).then((res: any) => {
        console.log(res)
        return res.data
      });

      // if (!(await User.exists({ _id: eventInput.creator }))) {
      //   throw new Error("user-not-found");
      // }

      // return await new Event(eventInput).save();
    },

    createUser: async (parent: any, args: any, ctx: Context, info: any) => {
      const { input } = args; // ? what if input is []
      const { db } = ctx;
      
      const fieldMap: any = {};
      const fieldMapKeys: string[] = fieldsList(info, {
        path: "node",
      });
      
      fieldMapKeys.forEach((key: string) => {
        fieldMap[key] = ["data", key]
      })
      fieldMap.id &&= ["ref", "id"]
      fieldMap.ts &&= ["ts"]
      
      // * validation
      // const fieldMapV: any = {...fieldMap};
      // delete fieldMapV.id
      // delete fieldMapV.ts
      // const fieldMapVKeys: string[] = Object.keys(fieldMapV)
      
      // ! trying to list class fields
      // and looking in Typescript docs for knowledge
      // ? maybe I should define a (sort of) global type
      // console.log(`keys2`, Object.keys(new User()) ) // * works!
      
      input.forEach((obj: object) => {
        // new User({
        //   obj: obj, 
        //   objKeys: fieldMapVKeys,
        // })
      });
      
      // * the very INITIAL GOAL was to add the 'indexing field' 
      // * automatically(see "Merge()") to created docs
      // ! was working on this resolver
      // - putting validation outside transaction
      // - handle (if needed) docs to return the client 
      //   outside transaction too?
      try {
        const res: any = await db.query(
          // q.Abort("aborted 4 test"),
          q.Abort("query underway"),
          
          /* q.Map(
            input,
            // ["296142445081526789", "296142424389976581", "296127950624916997"],
            q.Lambda("inputDoc", 
              q.Let(
                {
                  createdDoc: q.Create(q.Collection("user"), {
                    // data: Var("inputDoc")
                    data: q.Merge(
                      q.Var("inputDoc"),
                      { [INDEXING_FIELD.key]: INDEXING_FIELD.value },
                    ),
                  }),
                  // createdDoc: Get(Ref(Collection("user"), Var("inputDoc"))),
                  docToReturn: packDocument({
                    doc: q.Var("createdDoc"), 
                    fieldMap,
                    fieldMapKeys,
                  }),
                },
                q.Var("docToReturn")
              )
            )
          ) */
          
        );
        
        // console.log("res", res)
        return {
          code: "200",
          node: res,
        };
      } catch (e) {
        // return packQueryError({
        //   error: e,
        // })
        return {errorCode: null}
      }
      
    },
  },
  Query: {
    listEvent: async (parent: any, args: any, ctx: Context, info: any) => {
      // return await Event.find().lean({ autopopulate: true });

      const { db } = ctx;

      const ret = await db.query(
        Paginate(Collections())
      );
      console.log("ret", ret);
      
      // return await db.query(Paginate(Collections()));
      return ret;
    },

    listUser: async (parent: any, args: any, ctx: Context, info: any) => {
      const { pageInfo } = args;
      const { db } = ctx;
      
      const collectionName = "user";
      const indexName = "user";
      
      const fieldMap: any = fieldsMap(info, {
        path: "node",
      });
      const indexFields: string[] = ["ts", "id", "email", "nickname"];
      
      indexFields.forEach((key) => {
        if (fieldMap.hasOwnProperty(key)) {
          fieldMap[key] = Var(key);
        }
      });
      
      
      try {
        const res: any = await db.query(
          // Abort("aborted 4 test"),
          
          Let(
            {
              page: q.Map(
                Paginate(
                  Match(Index(indexName), INDEXING_FIELD.value),
                  { 
                    after: parseCursor({ 
                      cursorWrap: pageInfo.cursorAfter, 
                      collectionName, 
                    }),
                    size: pageInfo.size, 
                  }
                ),
                Lambda(
                  indexFields,
                  fieldMap
                )
              ),
              page_after: Select("after", Var("page"), SELECT_DEFAULT_VALUE),
              pageRepack: {
                data: Select("data", Var("page")),
                after: packCursor({
                  cursor: Var("page_after"),
                  indexFields_length: indexFields.length,
                }),
              }
            },
            Var("pageRepack")
          )
          
        );
        
        console.log("res", res)
        // console.log("res.data", res.data)
        return {
          code: "200",
          pageInfo: {
            cursorAfter: res.after,
          },
          node: res.data,
        };
      } catch (e) {
        return packQueryError({
          error: e,
        })
      }
      
    },
  },
};
