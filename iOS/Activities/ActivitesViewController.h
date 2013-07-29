//
//  ActivitesViewController.h
//  Activities
//
//  Created by Owen Campbell-Moore on 27/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "ActivityTableCell.h"

@interface ActivitesViewController : UITableViewController

@property NSArray *activities;
@property NSIndexPath *selectedCell;
@property ActivityTableCell *fakeActivityTableCell;

@end
