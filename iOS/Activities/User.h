//
//  User.h
//  Activities
//
//  Created by Owen Campbell-Moore on 10/3/13.
//  Copyright (c) 2013 A&O. All rights reserved.
//
//  This model is for managing the current users profile. The current access token is stored in Network instead of here although it could live in either.
//

#import <Foundation/Foundation.h>

@interface User : NSObject

@property (strong, nonatomic) NSString *name;
@property (assign, nonatomic) NSInteger user_id; // NSInteger isn't an object so we need assign instead of strong. This is used to work out whether an activity is owned by the current user and display edit options if it is.

@end
